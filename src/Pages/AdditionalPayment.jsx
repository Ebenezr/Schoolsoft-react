import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HiCheck } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import MaterialReactTable, {
  MRT_FullScreenToggleButton,
  MRT_GlobalFilterTextField,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFiltersButton,
} from "material-react-table";

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Pagination,
  ThemeProvider,
  Toolbar,
  Tooltip,
  createTheme,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import { Delete, Edit } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Toast } from "flowbite-react";

import axios from "axios";

import { ThemeContext } from "../context/ThemeContext";
import AdditionalPayUpdate from "../Components/modals/AdditionalPayUpdate";
import AdditionalPayCreate from "../Components/modals/AdditionalPayCreate";
const KES = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "KES",
});

const DarkTheme = createTheme({
  palette: {
    type: "dark",
  },
});

const LightTheme = createTheme({
  palette: {
    type: "light",
  },
});

const AdditionalPayment = () => {
  const { isDark } = useContext(ThemeContext);
  const queryClient = useQueryClient();
  const [columnFilters, setColumnFilters] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const tableInstanceRef = useRef(null);
  const [sorting, setSorting] = useState([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [selectedData, setSelectedData] = useState();
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,

    pageSize: 10,
  });

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: [
      "additionalfee-data",

      columnFilters,
      globalFilter,

      pagination.pageIndex,

      pagination.pageSize,

      sorting,
    ],

    queryFn: async () => {
      const fetchURL = new URL(
        `${process.env.REACT_APP_BASE_URL}/additionalfees`
      );

      fetchURL.searchParams.set(
        "start",

        `${pagination.pageIndex * pagination.pageSize}`
      );

      fetchURL.searchParams.set("size", `${pagination.pageSize}`);

      fetchURL.searchParams.set("filters", JSON.stringify(columnFilters ?? []));

      fetchURL.searchParams.set("globalFilter", globalFilter ?? "");

      fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));

      const response = await fetch(fetchURL.href);

      const json = await response.json();

      return json;
    },

    keepPreviousData: true,
  });
  useEffect(() => {
    data && setTableData(data.items);
  }, [data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",

        header: "Id",
        size: 40,
      },

      {
        accessorKey: "name",

        header: "Payment Type",
        size: 40,
      },

      {
        accessorKey: "amount",

        header: "Amount",
        size: 50,
        Cell: ({ cell }) => {
          return `${KES.format(cell.getValue() ?? 0)}`;
        },
      },
    ],

    []
  );

  const deletePost = useMutation((id) => {
    return axios
      .delete(`${process.env.REACT_APP_BASE_URL}/additionalfee/${id}`)
      .then(() => {
        queryClient.invalidateQueries(["guest-data"]);
        setShowSuccessToast(true);
        refetch();
      })
      .catch(() => {
        setShowErrorToast(true);
      });
  });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const handleDeleteRow = useCallback((row) => {
    setOpenConfirmDialog(true);
    setRowToDelete(row);
  }, []);
  // close dialog
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };
  const handleConfirmDelete = () => {
    if (rowToDelete) {
      deletePost.mutate(rowToDelete.getValue("id"));
      tableData.splice(rowToDelete.index, 1);
    }
    setOpenConfirmDialog(false);
    refetch();
  };

  // reset toast

  useEffect(() => {
    let successToastTimer;
    let errorToastTimer;

    if (showSuccessToast) {
      successToastTimer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
    }

    if (showErrorToast) {
      errorToastTimer = setTimeout(() => {
        setShowErrorToast(false);
      }, 2000);
    }

    return () => {
      clearTimeout(successToastTimer);
      clearTimeout(errorToastTimer);
    };
  }, [showSuccessToast, showErrorToast]);

  //column definitions...
  return (
    <section className=" h-full w-full  p-4">
      <h1 className="mb-4 font-semibold tracking-wide text-lg">
        Additinal Payments
      </h1>
      <ThemeProvider theme={isDark ? DarkTheme : LightTheme}>
        <Box className="border-slate-200 rounded border-[1px] p-4">
          {tableInstanceRef.current && (
            <Toolbar
              sx={() => ({
                backgroundColor: "#ede7f6",

                borderRadius: "4px",

                display: "flex",

                flexDirection: {
                  xs: "column",

                  lg: "row",
                },

                gap: "1rem",

                justifyContent: "space-between",

                p: "1.5rem 0",
              })}
            >
              <Box className="gap-3 flex items-center">
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  outline={true}
                  gradientDuoTone="purpleToBlue"
                >
                  Add Payment
                </Button>
              </Box>

              <MRT_GlobalFilterTextField table={tableInstanceRef.current} />

              <Box>
                <MRT_ToggleFiltersButton table={tableInstanceRef.current} />

                <MRT_ShowHideColumnsButton table={tableInstanceRef.current} />

                <MRT_ToggleDensePaddingButton
                  table={tableInstanceRef.current}
                />

                <MRT_FullScreenToggleButton table={tableInstanceRef.current} />
              </Box>
            </Toolbar>
          )}

          <MaterialReactTable
            columns={columns}
            data={tableData ?? []}
            initialState={{
              showGlobalFilter: true,
              showColumnFilters: false,
            }}
            enableTopToolbar={false}
            enableRowActions
            manualFiltering
            manualPagination
            manualSorting
            muiToolbarAlertBannerProps={
              isError
                ? {
                    color: "error",

                    children: "Error loading data",
                  }
                : undefined
            }
            onColumnFiltersChange={setColumnFilters}
            onGlobalFilterChange={setGlobalFilter}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            renderBottomToolbarCustomActions={() => (
              <>
                <Tooltip arrow title="Refresh Data">
                  <IconButton onClick={() => refetch()}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            renderRowActions={({ row }) => (
              <Box sx={{ display: "flex", gap: "1rem" }}>
                <Tooltip arrow placement="left" title="Edit">
                  <IconButton
                    onClick={() => {
                      setUpdateModalOpen(true);
                      setSelectedData(row);
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>

                <Tooltip arrow placement="right" title="Delete">
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteRow(row)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            rowCount={data?.itemsPerPage ?? 0}
            tableInstanceRef={tableInstanceRef}
            state={{
              columnFilters,

              globalFilter,

              isLoading,

              pagination,

              showAlertBanner: isError,

              showProgressBars: isFetching,

              sorting,
            }}
            {...(tableInstanceRef.current && (
              <Toolbar
                sx={{
                  display: "flex",

                  justifyContent: "center",

                  flexDirection: "column",
                }}
              >
                <Box
                  className="place-items-center"
                  sx={{ display: "grid", width: "100%" }}
                >
                  <Pagination
                    variant="outlined"
                    shape="rounded"
                    count={data?.totalPages ?? 0}
                    page={pagination.pageIndex + 1}
                    onChange={(event, value) =>
                      setPagination((prevPagination) => ({
                        ...prevPagination,
                        pageIndex: value - 1,
                      }))
                    }
                  />
                </Box>
              </Toolbar>
            ))}
          />
          {/* Custom Bottom Toolbar */}

          {tableInstanceRef.current && (
            <Toolbar
              sx={{
                display: "flex",

                justifyContent: "center",

                flexDirection: "column",
              }}
            >
              <Box
                className="place-items-center"
                sx={{ display: "grid", width: "100%" }}
              >
                <Pagination
                  variant="outlined"
                  shape="rounded"
                  count={data?.totalPages ?? 0}
                  page={pagination.pageIndex + 1}
                  onChange={(event, value) =>
                    setPagination((prevPagination) => ({
                      ...prevPagination,
                      pageIndex: value - 1,
                    }))
                  }
                />
              </Box>
            </Toolbar>
          )}
        </Box>
      </ThemeProvider>
      <AdditionalPayCreate
        open={createModalOpen}
        setShowSuccessToast={setShowSuccessToast}
        setShowErrorToast={setShowErrorToast}
        onClose={() => setCreateModalOpen(false)}
      />
      <AdditionalPayUpdate
        open={updateModalOpen}
        setShowSuccessToast={setShowSuccessToast}
        setShowErrorToast={setShowErrorToast}
        onClose={() => setUpdateModalOpen(false)}
        objData={selectedData?.original}
      />
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this guest?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* toast */}
      {showSuccessToast && (
        <Toast className="absolute bottom-4 left-4">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200">
            <HiCheck className="h-5 w-5" />
          </div>
          <div className="ml-3 text-sm font-normal">Data Updated Success.</div>
          <Toast.Toggle onClick={() => setShowSuccessToast(false)} />
        </Toast>
      )}
      {showErrorToast && (
        <Toast className="absolute bottom-4 left-4">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200">
            <IoMdClose className="h-5 w-5" />
          </div>
          <div className="ml-3 text-sm font-normal">Data update failed.</div>
          <Toast.Toggle onClick={() => setShowErrorToast(false)} />
        </Toast>
      )}
    </section>
  );
};

export default AdditionalPayment;
